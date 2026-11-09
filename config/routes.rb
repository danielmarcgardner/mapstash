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
    resources :places
    resources :lists
    resources :tags do
      collection do
        get "add_tag_to_place", to: "tags#add_tag_to_place"
        get "remove_tag_from_place", to: "tags#remove_tag_from_place"
      end
    end
    get "up" => "rails/health#show", as: :rails_health_check
    get "users/me", to: "users#me"
  end

  root to: redirect("/index.html")
end
