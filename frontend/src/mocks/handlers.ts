import { http, HttpResponse } from 'msw'

// Mock data
export let mockProjects = []
export let mockGroups = []
export let mockEvents = []
export let mockReleases = []
export let mockRules = []
export let mockDeployments = []
export let mockHealth = []
export let mockSeries = []

export const resetMockData = () => {
  mockProjects = [
    { id: 1, name: 'Test Project', slug: 'test-project', ingest_token: 'test-token-123' },
    { id: 2, name: 'Another Project', slug: 'another-project', ingest_token: 'test-token-456' }
  ]

  mockGroups = [
    { id: 1, title: 'TypeError: Cannot read property', level: 'error', count: 5 },
    { id: 2, title: 'ReferenceError: undefined variable', level: 'error', count: 3 },
    { id: 3, title: 'Network timeout', level: 'warning', count: 8 }
  ]

  mockEvents = [
    { 
      id: 1, 
      message: 'Test error message', 
      level: 'error', 
      timestamp: '2023-01-01T12:00:00Z',
      stack: 'Error: Test\n  at test.js:1:1',
      release: 1,
      environment: 'production'
    },
    { 
      id: 2, 
      message: 'Another error', 
      level: 'warning', 
      timestamp: '2023-01-01T12:05:00Z',
      stack: null,
      release: null,
      environment: 'staging'
    }
  ]

  mockReleases = [
    { id: 1, version: '1.0.0', environment: 'production', created: '2023-01-01T10:00:00Z' },
    { id: 2, version: '1.0.1', environment: 'staging', created: '2023-01-01T11:00:00Z' }
  ]

  mockRules = [
    { 
      id: 1, 
      name: 'High Error Rate', 
      level: 'error', 
      threshold_count: 10, 
      threshold_window_minutes: 5,
      notify_interval_minutes: 60,
      target_type: 'email',
      target_value: 'admin@test.com'
    }
  ]

  mockDeployments = [
    { 
      id: 1, 
      name: 'Production Deploy', 
      url: 'https://app.test.com', 
      environment: 'production',
      release: 1,
      created: '2023-01-01T12:00:00Z'
    }
  ]

  mockHealth = [
    { release: '1.0.0', sessions: 1000, errors: 5, crashed: 1 },
    { release: '1.0.1', sessions: 500, errors: 2, crashed: 0 }
  ]

  mockSeries = [
    { name: 'Sessions', data: [[1672574400000, 100], [1672660800000, 150]] },
    { name: 'Errors', data: [[1672574400000, 5], [1672660800000, 3]] }
  ]
}

resetMockData()

export const handlers = [
  // Projects endpoints
  http.get('/api/projects', () => {
    return HttpResponse.json(mockProjects)
  }),

  http.post('/api/projects', async ({ request }) => {
    const body = await request.json()
    const newProject = {
      id: mockProjects.length + 1,
      name: body.name,
      slug: body.slug,
      ingest_token: `token-${Date.now()}`
    }
    return HttpResponse.json(newProject, { status: 201 })
  }),

  // Groups endpoints
  http.get('/api/groups', ({ request }) => {
    const url = new URL(request.url)
    const project = url.searchParams.get('project')
    if (!project) {
      return HttpResponse.json({ error: 'Project required' }, { status: 400 })
    }
    return HttpResponse.json(mockGroups)
  }),

  // Events endpoints
  http.get('/api/events', ({ request }) => {
    const url = new URL(request.url)
    const project = url.searchParams.get('project')
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')
    
    if (!project) {
      return HttpResponse.json({ error: 'Project required' }, { status: 400 })
    }

    const results = mockEvents.slice(offset, offset + limit)
    return HttpResponse.json({ results, count: mockEvents.length })
  }),

  http.get('/api/events/:id', ({ params }) => {
    const { id } = params
    const event = mockEvents.find(e => e.id === parseInt(id as string))
    
    if (!event) {
      return HttpResponse.json({ detail: 'Event not found' }, { status: 404 })
    }

    return HttpResponse.json({
      ...event,
      symbolicated: event.stack ? { frames: [{ filename: 'test.js', lineno: 1 }] } : null
    })
  }),

  http.post('/api/events/ingest/token/:token', async ({ params, request }) => {
    const { token } = params
    const project = mockProjects.find(p => p.ingest_token === token)
    if (!project) {
      return HttpResponse.json({ detail: 'No Project matches the given query.' }, { status: 404 })
    }

    return HttpResponse.json({ success: true, eventId: Date.now() })
  }),

  // Releases endpoints
  http.get('/api/releases', ({ request }) => {
    const url = new URL(request.url)
    const project = url.searchParams.get('project')
    if (!project) {
      return HttpResponse.json({ error: 'Project required' }, { status: 400 })
    }
    return HttpResponse.json(mockReleases)
  }),

  http.post('/api/releases', async ({ request }) => {
    const body = await request.json()
    const newRelease = {
      id: mockReleases.length + 1,
      version: body.version,
      environment: body.environment,
      project: body.project,
      created: new Date().toISOString()
    }
    return HttpResponse.json(newRelease, { status: 201 })
  }),

  http.get('/api/releases/health', ({ request }) => {
    const url = new URL(request.url)
    const project = url.searchParams.get('project')
    if (!project) {
      return HttpResponse.json({ error: 'Project required' }, { status: 400 })
    }
    return HttpResponse.json(mockHealth)
  }),

  http.get('/api/releases/health/series', ({ request }) => {
    const url = new URL(request.url)
    const project = url.searchParams.get('project')
    if (!project) {
      return HttpResponse.json({ error: 'Project required' }, { status: 400 })
    }
    return HttpResponse.json(mockSeries)
  }),

  // Alert Rules endpoints
  http.get('/api/alert-rules', ({ request }) => {
    const url = new URL(request.url)
    const project = url.searchParams.get('project')
    if (!project) {
      return HttpResponse.json({ error: 'Project required' }, { status: 400 })
    }
    return HttpResponse.json(mockRules)
  }),

  http.post('/api/alert-rules', async ({ request }) => {
    const body = await request.json()
    const newRule = {
      id: mockRules.length + 1,
      name: body.name,
      level: body.level,
      threshold_count: body.threshold_count,
      target_type: body.target_type,
      target_value: body.target_value,
      project: body.project
    }
    return HttpResponse.json(newRule, { status: 201 })
  }),

  http.patch('/api/alert-rules/:id', async ({ params, request }) => {
    const { id } = params
    const body = await request.json()
    const rule = mockRules.find(r => r.id === parseInt(id as string))
    
    if (!rule) {
      return HttpResponse.json({ error: 'Rule not found' }, { status: 404 })
    }

    const updatedRule = { ...rule, ...body }
    return HttpResponse.json(updatedRule)
  }),

  http.post('/api/alert-rules/:id/snooze', async ({ params, request }) => {
    const { id } = params
    const body = await request.json()
    const group = mockGroups.find(g => g.id === body.group)
    if (!group) {
      return HttpResponse.json({ detail: 'No Group matches the given query.' }, { status: 404 })
    }
    
    return HttpResponse.json({ 
      success: true, 
      ruleId: parseInt(id as string),
      groupId: body.group,
      minutes: body.minutes 
    })
  }),

  // Deployments endpoints
  http.get('/api/deployments', ({ request }) => {
    const url = new URL(request.url)
    const project = url.searchParams.get('project')
    if (!project) {
      return HttpResponse.json({ error: 'Project required' }, { status: 400 })
    }
    return HttpResponse.json(mockDeployments)
  }),

  http.post('/api/deployments', async ({ request }) => {
    const body = await request.json()
    const newDeployment = {
      id: mockDeployments.length + 1,
      name: body.name,
      url: body.url,
      environment: body.environment,
      release: body.release,
      project: body.project,
      created: new Date().toISOString()
    }
    return HttpResponse.json(newDeployment, { status: 201 })
  }),

  // Sessions endpoints
  http.post('/api/sessions/ingest/token/:token', async ({ params, request }) => {
    const { token } = params
    const project = mockProjects.find(p => p.ingest_token === token)
    if (!project) {
      return HttpResponse.json({ detail: 'No Project matches the given query.' }, { status: 404 })
    }
    const body = await request.json()
    return HttpResponse.json({ 
      success: true, 
      sessionId: body.session_id,
      status: body.status 
    })
  }),

  // Symbolication endpoint
  http.post('/api/symbolicate', async ({ request }) => {
    const body = await request.json()
    
    return HttpResponse.json({
      frames: [
        {
          filename: `${body.project}/main.js`,
          function: 'handleError',
          lineno: 42,
          colno: 15,
          context_line: 'throw new Error("Test error");',
          pre_context: ['function handleError() {', '  // Handle the error'],
          post_context: ['}', ''],
          in_app: true
        }
      ]
    })
  }),

  // Dashboard series endpoint
  http.get('/api/dashboard/series', ({ request }) => {
    const url = new URL(request.url)
    const project = url.searchParams.get('project')
    const env = url.searchParams.get('env')
    const range = url.searchParams.get('range') || '1h'
    const interval = url.searchParams.get('interval') || '5m'
    
    if (!project) {
      return HttpResponse.json({ error: 'Project required' }, { status: 400 })
    }

    // Filter events by environment if specified
    let filteredEvents = mockEvents
    if (env) {
      filteredEvents = mockEvents.filter(event => event.environment === env)
    }

    // Generate mock time-series data based on filtered events
    const now = new Date()
    const mockSeries = []
    
    // If no events match the filter, return empty series
    if (filteredEvents.length === 0) {
      return HttpResponse.json([])
    }

    // Generate some sample time buckets with data
    for (let i = 0; i < 5; i++) {
      const bucketTime = new Date(now.getTime() - (i * 3600000)) // 1 hour intervals
      const errorCount = Math.max(0, filteredEvents.filter(e => e.level === 'error').length - i)
      const warningCount = Math.max(0, filteredEvents.filter(e => e.level === 'warning').length - i)
      
      if (errorCount > 0 || warningCount > 0) {
        mockSeries.unshift({
          bucket: bucketTime.toISOString().slice(0, 16) + ':00', // Format as YYYY-MM-DD HH:MM:00
          error: errorCount,
          warning: warningCount, 
          info: 0
        })
      }
    }

    return HttpResponse.json(mockSeries)
  })
]