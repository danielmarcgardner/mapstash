#  frozen_string_literal: true

Rails.application.routes.draw do
  # Render's health check (healthCheckPath: /up).
  get "up" => "rails/health#show", as: :rails_health_check

  devise_for :users,
  path: "api", # 👈 explicitly sets path
  path_names: { sign_in: "login", sign_out: "logout", registration: "signup" },
  controllers: {
    sessions: "sessions",
    registrations: "registrations"
  }

  namespace :api do
    resources :places do
      resources :tags, only: %i[create destroy], controller: "place_tags"
    end
    resources :lists
    resources :tags
    get "users/me", to: "users#me"
  end

  # The React app owns every other HTML page, so a refresh on /login loads it instead of a 404.
  root to: "frontend#index"
  get "*path", to: "frontend#index", constraints: ->(req) { req.format.html? && !req.path.start_with?("/api") }
end
