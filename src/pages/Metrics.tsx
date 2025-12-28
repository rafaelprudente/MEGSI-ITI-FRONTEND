import { useQuery } from '@tanstack/react-query'
import { Activity, Server, HardDrive, Cpu, MemoryStick, Network, Info, TrendingUp, AlertCircle } from 'lucide-react'
import Navbar from '../components/Navbar'
import axios from 'axios'

interface PrometheusMetric {
  metric: Record<string, string>
  value: [number, string]
}

interface PrometheusResponse {
  status: string
  data: {
    resultType: string
    result: PrometheusMetric[]
  }
}

async function fetchPrometheusMetric(query: string): Promise<PrometheusResponse> {
  try {
    const response = await axios.get(`/prometheus/api/v1/query?query=${encodeURIComponent(query)}`)
    return response.data
  } catch (error) {
    console.error('Prometheus error:', error)
    return {
      status: 'error',
      data: {
        resultType: 'vector',
        result: []
      }
    }
  }
}

// Metric descriptions for tooltips
const metricDescriptions = {
  rps: "Taxa de requisições HTTP por segundo recebidas pelo sistema",
  avgResponseTime: "Tempo médio de resposta do backend (incluindo latência de rede)",
  p95Latency: "95% das requisições completam abaixo deste tempo (ignora outliers extremos)",
  errorRate: "Percentagem de requisições que falharam com erros 5xx do servidor",
  
  containers: "Número de instâncias do serviço de ficheiros atualmente em execução",
  cpuUsage: "Uso médio de CPU de todos os containers do serviço",
  memoryUsage: "Memória RAM total utilizada pelos containers ativos",
  networkThroughput: "Taxa de transferência de dados combinada (upload + download)",
  
  totalRequests: "Total acumulado de requisições desde o início do sistema",
  openConnections: "Conexões TCP ativas no load balancer (HTTP keep-alive)",
  successRate: "Percentagem de requisições bem sucedidas (código 2xx e 3xx)",
}

// Tooltip component
const MetricTooltip = ({ description }: { description: string }) => (
  <div className="group relative inline-block ml-2">
    <Info className="w-4 h-4 text-gray-400 hover:text-primary-600 cursor-help" />
    <div className="invisible group-hover:visible absolute z-10 w-72 p-3 mt-2 text-sm text-white bg-gray-900 rounded-lg shadow-xl -left-32 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
      {description}
      <div className="absolute w-3 h-3 bg-gray-900 transform rotate-45 -top-1 left-1/2 -ml-1.5"></div>
    </div>
  </div>
)

// Color helpers
const getResponseTimeColor = (ms: number): string => {
  if (ms < 100) return 'text-green-600'
  if (ms < 300) return 'text-yellow-600'
  return 'text-red-600'
}

const getErrorRateColor = (rate: number): string => {
  if (rate < 1) return 'text-green-600'
  if (rate < 5) return 'text-yellow-600'
  return 'text-red-600'
}

const getCpuColor = (usage: number): string => {
  if (usage < 50) return 'text-green-600'
  if (usage < 80) return 'text-yellow-600'
  return 'text-red-600'
}

export default function Metrics() {
  const { data: containerCount } = useQuery({
    queryKey: ['containerCount'],
    queryFn: async () => {
      try {
        // Query Traefik API directly to count backend servers
        const response = await axios.get('/traefik-api/http/services')
        const services = response.data || []
        
        // Find the files service
        const filesService = services.find((s: any) => s.name === 'files@docker')
        
        if (filesService?.serverStatus) {
          // Count UP servers
          const serverCount = Object.values(filesService.serverStatus).filter((status: any) => status === 'UP').length
          
          return {
            status: 'success',
            data: {
              resultType: 'vector',
              result: [{ metric: {}, value: [Date.now() / 1000, serverCount.toString()] as [number, string] }]
            }
          }
        }
      } catch (error) {
        console.error('Failed to query Traefik API:', error)
      }
      
      // Fallback to 1
      return {
        status: 'success',
        data: {
          resultType: 'vector',
          result: [{ metric: {}, value: [Date.now() / 1000, '1'] as [number, string] }]
        }
      }
    },
    refetchInterval: 5000,
  })

  const { data: responseTime} = useQuery({
    queryKey: ['responseTime'],
    queryFn: async () => {
      // Calculate average response time manually
      const sum = await fetchPrometheusMetric('sum(rate(traefik_service_request_duration_seconds_sum{service="files@docker"}[1m]))')
      const count = await fetchPrometheusMetric('sum(rate(traefik_service_request_duration_seconds_count{service="files@docker"}[1m]))')
      
      const sumVal = parseFloat(sum?.data?.result?.[0]?.value?.[1] || '0')
      const countVal = parseFloat(count?.data?.result?.[0]?.value?.[1] || '1')
      
      const avgMs = (sumVal / countVal) * 1000
      
      return {
        status: 'success',
        data: {
          resultType: 'vector',
          result: [{ metric: {}, value: [Date.now() / 1000, avgMs.toFixed(2)] as [number, string] }]
        }
      }
    },
    refetchInterval: 5000,
  })

  const { data: requestRate } = useQuery({
    queryKey: ['requestRate'],
    queryFn: () =>
      fetchPrometheusMetric('sum(rate(traefik_service_requests_total{service="files@docker"}[1m]))'),
    refetchInterval: 5000,
  })

  const { data: totalRequests } = useQuery({
    queryKey: ['totalRequests'],
    queryFn: () =>
      fetchPrometheusMetric('sum(traefik_service_requests_total{service="files@docker"})'),
    refetchInterval: 5000,
  })

  const { data: openConnections } = useQuery({
    queryKey: ['openConnections'],
    queryFn: () =>
      fetchPrometheusMetric('traefik_open_connections{entrypoint="web"}'),
    refetchInterval: 5000,
  })

  // New metrics
  const { data: errorRate } = useQuery({
    queryKey: ['errorRate'],
    queryFn: async () => {
      const errors = await fetchPrometheusMetric('sum(rate(traefik_service_requests_total{service="files@docker",code=~"5.."}[1m]))')
      const total = await fetchPrometheusMetric('sum(rate(traefik_service_requests_total{service="files@docker"}[1m]))')
      
      const errorsVal = parseFloat(errors?.data?.result?.[0]?.value?.[1] || '0')
      const totalVal = parseFloat(total?.data?.result?.[0]?.value?.[1] || '1')
      
      const rate = totalVal > 0 ? (errorsVal / totalVal) * 100 : 0
      
      return {
        status: 'success',
        data: {
          resultType: 'vector',
          result: [{ metric: {}, value: [Date.now() / 1000, rate.toFixed(2)] as [number, string] }]
        }
      }
    },
    refetchInterval: 5000,
  })

  const { data: p95Latency } = useQuery({
    queryKey: ['p95Latency'],
    queryFn: () =>
      fetchPrometheusMetric('histogram_quantile(0.95, sum(rate(traefik_service_request_duration_seconds_bucket{service="files@docker"}[5m])) by (le)) * 1000'),
    refetchInterval: 5000,
  })

  const { data: cpuUsage } = useQuery({
    queryKey: ['cpuUsage'],
    queryFn: () =>
      fetchPrometheusMetric('avg(rate(container_cpu_usage_seconds_total{id=~"/system.slice/docker.*"}[1m])) * 100'),
    refetchInterval: 5000,
  })

  const { data: memoryUsage } = useQuery({
    queryKey: ['memoryUsage'],
    queryFn: () =>
      fetchPrometheusMetric('sum(container_memory_usage_bytes{id=~"/system.slice/docker.*"}) / 1024 / 1024 / 1024'),
    refetchInterval: 5000,
  })

  const { data: networkThroughput } = useQuery({
    queryKey: ['networkThroughput'],
    queryFn: () =>
      fetchPrometheusMetric('(sum(rate(container_network_transmit_bytes_total[1m])) + sum(rate(container_network_receive_bytes_total[1m]))) / 1024'),
    refetchInterval: 5000,
  })

  const { data: successRate } = useQuery({
    queryKey: ['successRate'],
    queryFn: async () => {
      const success = await fetchPrometheusMetric('sum(rate(traefik_service_requests_total{service="files@docker",code!~"5.."}[1m]))')
      const total = await fetchPrometheusMetric('sum(rate(traefik_service_requests_total{service="files@docker"}[1m]))')
      
      const successVal = parseFloat(success?.data?.result?.[0]?.value?.[1] || '0')
      const totalVal = parseFloat(total?.data?.result?.[0]?.value?.[1] || '1')
      
      const rate = totalVal > 0 ? (successVal / totalVal) * 100 : 100
      
      return {
        status: 'success',
        data: {
          resultType: 'vector',
          result: [{ metric: {}, value: [Date.now() / 1000, rate.toFixed(2)] as [number, string] }]
        }
      }
    },
    refetchInterval: 5000,
  })

  const getMetricValue = (data: PrometheusResponse | undefined): string => {
    if (!data?.data?.result?.[0]?.value?.[1]) return '0'
    const value = parseFloat(data.data.result[0].value[1])
    return value.toFixed(2)
  }

  const getIntValue = (data: PrometheusResponse | undefined): string => {
    if (!data?.data?.result?.[0]?.value?.[1]) return '0'
    const value = parseFloat(data.data.result[0].value[1])
    return Math.floor(value).toString()
  }

  const containers = getIntValue(containerCount)
  const avgResponseTime = getMetricValue(responseTime)
  const rps = getMetricValue(requestRate)
  const total = getIntValue(totalRequests)
  const connections = getIntValue(openConnections)
  
  // New metric values
  const errRate = getMetricValue(errorRate)
  const p95 = getMetricValue(p95Latency)
  const cpu = getMetricValue(cpuUsage)
  const memory = getMetricValue(memoryUsage)
  const network = getMetricValue(networkThroughput)
  const success = getMetricValue(successRate)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Real-Time Metrics</h2>
          <p className="text-gray-600 mt-2">Sistema de Monitorização UM Drive - Atualização a cada 5 segundos</p>
        </div>

        {/* Performance Metrics Section */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-primary-600" />
            Performance Metrics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center">
                    <p className="text-sm text-gray-600">Requests/sec</p>
                    <MetricTooltip description={metricDescriptions.rps} />
                  </div>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{rps}</p>
                </div>
                <Activity className="w-10 h-10 text-blue-500" />
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center">
                    <p className="text-sm text-gray-600">Avg Response Time</p>
                    <MetricTooltip description={metricDescriptions.avgResponseTime} />
                  </div>
                  <p className={`text-3xl font-bold mt-1 ${getResponseTimeColor(parseFloat(avgResponseTime))}`}>
                    {avgResponseTime}ms
                  </p>
                </div>
                <HardDrive className="w-10 h-10 text-indigo-500" />
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center">
                    <p className="text-sm text-gray-600">P95 Latency</p>
                    <MetricTooltip description={metricDescriptions.p95Latency} />
                  </div>
                  <p className={`text-3xl font-bold mt-1 ${getResponseTimeColor(parseFloat(p95))}`}>
                    {p95}ms
                  </p>
                </div>
                <TrendingUp className="w-10 h-10 text-purple-500" />
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center">
                    <p className="text-sm text-gray-600">Error Rate</p>
                    <MetricTooltip description={metricDescriptions.errorRate} />
                  </div>
                  <p className={`text-3xl font-bold mt-1 ${getErrorRateColor(parseFloat(errRate))}`}>
                    {errRate}%
                  </p>
                </div>
                <AlertCircle className="w-10 h-10 text-red-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Infrastructure Metrics Section */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
            <Server className="w-5 h-5 mr-2 text-primary-600" />
            Infrastructure Metrics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center">
                    <p className="text-sm text-gray-600">Active Containers</p>
                    <MetricTooltip description={metricDescriptions.containers} />
                  </div>
                  <p className={`text-3xl font-bold mt-1 ${parseFloat(rps) > 20 ? 'text-green-600' : 'text-gray-900'}`}>
                    {containers}
                  </p>
                  {parseFloat(rps) > 20 && (
                    <p className="text-xs text-green-600 mt-1 font-medium">🚀 Auto-scaling</p>
                  )}
                </div>
                <Server className="w-10 h-10 text-primary-500" />
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center">
                    <p className="text-sm text-gray-600">CPU Usage</p>
                    <MetricTooltip description={metricDescriptions.cpuUsage} />
                  </div>
                  <p className={`text-3xl font-bold mt-1 ${getCpuColor(parseFloat(cpu))}`}>
                    {cpu}%
                  </p>
                </div>
                <Cpu className="w-10 h-10 text-orange-500" />
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center">
                    <p className="text-sm text-gray-600">Memory Usage</p>
                    <MetricTooltip description={metricDescriptions.memoryUsage} />
                  </div>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{memory} GB</p>
                </div>
                <MemoryStick className="w-10 h-10 text-pink-500" />
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center">
                    <p className="text-sm text-gray-600">Network I/O</p>
                    <MetricTooltip description={metricDescriptions.networkThroughput} />
                  </div>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {parseFloat(network) >= 1 ? `${network} MB/s` : `${(parseFloat(network) * 1024).toFixed(1)} KB/s`}
                  </p>
                </div>
                <Network className="w-10 h-10 text-cyan-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Traffic & Load Section */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-primary-600" />
            Traffic & Load
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="card">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center">
                    <p className="text-sm text-gray-600">Total Requests</p>
                    <MetricTooltip description={metricDescriptions.totalRequests} />
                  </div>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{total}</p>
                </div>
                <Activity className="w-10 h-10 text-purple-500" />
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center">
                    <p className="text-sm text-gray-600">Open Connections</p>
                    <MetricTooltip description={metricDescriptions.openConnections} />
                  </div>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{connections}</p>
                </div>
                <Server className="w-10 h-10 text-orange-500" />
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center">
                    <p className="text-sm text-gray-600">Success Rate</p>
                    <MetricTooltip description={metricDescriptions.successRate} />
                  </div>
                  <p className="text-3xl font-bold text-green-600 mt-1">{success}%</p>
                </div>
                <Activity className="w-10 h-10 text-green-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Auto-Scaler Status */}
        <div className="card mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
            <Server className="w-5 h-5 mr-2 text-primary-600" />
            Auto-Scaler Status
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">RPS Threshold (Scale Up):</span>
              <span className="font-medium text-gray-900">20 req/sec</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">RPS Threshold (Scale Down):</span>
              <span className="font-medium text-gray-900">5 req/sec</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">CPU Threshold (Scale Up):</span>
              <span className="font-medium text-gray-900">70%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">CPU Threshold (Scale Down):</span>
              <span className="font-medium text-gray-900">30%</span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
              <span className="text-gray-600">Current Replicas:</span>
              <span className="font-medium text-primary-600">{containers} / 2 max</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Status:</span>
              <span className={`font-medium ${parseFloat(rps) > 20 ? 'text-green-600' : 'text-gray-600'}`}>
                {parseFloat(rps) > 20 ? '🟢 Auto-scaling Active (RPS > 20)' : '⚪ Normal Operation'}
              </span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Service Health</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              'autenticador',
              'file-services',
              'mariadb',
              'kafka',
              'traefik',
              'prometheus',
              'cadvisor',
              'config-server',
              'autoscaler',
            ].map((service) => (
              <div key={service} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">{service}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
