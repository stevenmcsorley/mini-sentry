# frozen_string_literal: true

# Rack middleware for Rails/Rack apps to forward unhandled errors to Mini Sentry
# Usage (Rails):
#   # config/application.rb or an initializer
#   require Rails.root.join('examples', 'ruby-rails', 'ms_middleware')
#   config.middleware.insert_after ActionDispatch::ShowExceptions, MiniSentryRack

require 'net/http'
require 'json'

class MiniSentryRack
  def initialize(app)
    @app = app
    @base = ENV['MS_BASE'] || 'http://localhost:8000'
    @token = ENV['MS_TOKEN'] || 'PASTE_INGEST_TOKEN'
  end

  def call(env)
    @app.call(env)
  rescue => e
    begin
      uri = URI("#{@base}/api/events/ingest/token/#{@token}/")
      payload = {
        message: e.message,
        level: 'error',
        stack: e.full_message(highlight: false, order: :bottom),
        release: ENV['MS_RELEASE'] || '1.0.0',
        environment: ENV['RAILS_ENV'] || ENV['RACK_ENV'] || 'development',
        app: 'rails-example',
      }
      Net::HTTP.start(uri.host, uri.port) do |http|
        req = Net::HTTP::Post.new(uri, 'Content-Type' => 'application/json')
        req.body = JSON.dump(payload)
        http.request(req)
      end
    rescue
      # swallow reporting failures
    end
    raise
  end
end

