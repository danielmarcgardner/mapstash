# frozen_string_literal: true

module Api
  class UsersController < ApplicationController
    before_action :authenticate_user!

    def me
      render json: current_user
    end
  end
end
