# frozen_string_literal: true

module Api
  class PlaceVisitsController < ApplicationController
    before_action :authenticate_user!
    before_action :set_place

    def create
      @place.visited_on = params[:visited_on].presence || Date.current
      @place.save!(touch: false)
      render json: @place, status: :ok
    end

    def destroy
      @place.update_columns(visited_on: nil)
      render json: @place, status: :ok
    end

    private

    def set_place
      @place = current_user.places.find(params[:place_id])
    end
  end
end
