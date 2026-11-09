#  frozen_string_literal: true

Rails.application.routes.draw do
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
    get "up" => "rails/health#show", as: :rails_health_check
    get "users/me", to: "users#me"
  end

  root to: redirect("/index.html")
end
