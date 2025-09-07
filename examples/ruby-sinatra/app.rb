require 'sinatra'
require 'net/http'
require 'json'

BASE = ENV['MS_BASE'] || 'http://localhost:8000'
TOKEN = ENV['MS_TOKEN'] || 'PASTE_INGEST_TOKEN'

def send_event(message, level: 'error', stack: nil)
  uri = URI("#{BASE}/api/events/ingest/token/#{TOKEN}/")
  body = { message: message, level: level, stack: stack, release: '1.0.0', environment: 'development', app: 'sinatra-example' }
  Net::HTTP.start(uri.host, uri.port) do |http|
    req = Net::HTTP::Post.new(uri, 'Content-Type' => 'application/json')
    req.body = body.to_json
    http.request(req)
  end
end

get '/' do
  'OK'
end

get '/boom' do
  begin
    raise 'Deliberate error from Sinatra'
  rescue => e
    send_event(e.message, stack: e.full_message)
    status 500
    'Reported error'
  end
end

