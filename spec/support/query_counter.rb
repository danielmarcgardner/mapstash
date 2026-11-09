# frozen_string_literal: true

# Counts SQL queries run inside the block, for N+1 guards: expect(query_count { get ... }).to eq(baseline)
module QueryCounter
  def query_count(&block)
    count = 0
    counter = ->(*, payload) { count += 1 unless payload[:name].in?(%w[SCHEMA TRANSACTION]) }
    ActiveSupport::Notifications.subscribed(counter, "sql.active_record", &block)
    count
  end
end

RSpec.configure do |config|
  config.include QueryCounter, type: :request
end
