# frozen_string_literal: true

module Api
  class PlaceVisitsController < ApplicationController
    before_action :authenticate_user!
    before_action :set_place

    # update_columns keeps updated_at unchanged and skips validations, so validate! runs first (422 via RecordInvalid).
    def create
      @place.visited_on = params[:visited_on].presence || Date.current
      @place.validate!
      @place.update_columns(visited_on: @place.visited_on)
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
