# frozen_string_literal: true

require "rails_helper"

RSpec.describe "config/initializers/required_env.rb" do
  let(:initializer) { Rails.root.join("config/initializers/required_env.rb") }
  let(:env) { { "JWT_SECRET_KEY" => "secret", "DATABASE_URL" => "postgres://db/app" } }

  def boot_in(rails_env, vars)
    allow(Rails).to receive(:env).and_return(ActiveSupport::EnvironmentInquirer.new(rails_env))
    allow(ENV).to receive(:[]).and_call_original
    %w[JWT_SECRET_KEY DATABASE_URL].each { |key| allow(ENV).to receive(:[]).with(key).and_return(vars[key]) }
    load initializer
  end

  it "boots in production when every required variable is set" do
    expect { boot_in("production", env) }.not_to raise_error
  end

  it "fails in production when JWT_SECRET_KEY is missing, naming it" do
    expect { boot_in("production", env.except("JWT_SECRET_KEY")) }.to raise_error(/JWT_SECRET_KEY/)
  end

  it "fails in production when DATABASE_URL is blank, naming it" do
    expect { boot_in("production", env.merge("DATABASE_URL" => "")) }.to raise_error(/DATABASE_URL/)
  end

  it "doesn't check outside production" do
    expect { boot_in("development", {}) }.not_to raise_error
  end
end
