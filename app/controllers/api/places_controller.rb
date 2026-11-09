# frozen_string_literal: true

module Api
  class PlacesController < ApplicationController
    before_action :authenticate_user!
    before_action :set_place, only: %i[show update destroy]

    def index
      @places = current_user.places.includes(:tags).order(created_at: :desc)
      render json: @places, status: :ok
    end

    def show
      render json: @place, status: :ok
    end

    def create
      @place = current_user.places.new(place_params)

      if @place.save
        render json: @place, status: :created
      else
        render json: { errors: @place.errors.full_messages }, status: :unprocessable_content
      end
    end

    def update
      if @place.update(place_params)
        render json: @place, status: :ok
      else
        render json: { errors: @place.errors.full_messages }, status: :unprocessable_content
      end
    end

    def destroy
      @place.destroy!
      head :no_content
    end

    private

    def set_place
      @place = current_user.places.find(params[:id])
    end

    def place_params
      params.require(:place).permit(:title, :address, :lat, :lng, :description, :link_url, :image_url, :location_name, :notes, :visited, :google_place_id)
    end
  end
end
