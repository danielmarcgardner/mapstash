# frozen_string_literal: true

module Api
  class PlacesController < ApplicationController
    before_action :authenticate_user!

    def index
      @places = current_user.places.order(created_at: :desc)
      render json: @places, status: :ok
    end

    def create
      @list = current_user.places.new(place_params)

      if @place.save
        render json: @place, status: :created
      else
        render json: { errors: @place.errors.full_messages }, status: :unprocessable_content
      end
    end

    def update
      @place = current_user.places.find(params[:id])
      if @place.update(place_params)
        render json: @place, status: :ok
      else
        render json: { errors: @place.errors.full_messages }, status: :unprocessable_content
      end
    end

    def destroy
      @place = current_user.places.find(params[:id])

      if @place.destroy
        head :no_content
      else
        render json: { errors: @place.errors.full_messages }, status: :unprocessable_content
      end
    end

    private

    def place_params
      params.require(:place).permit(:title, :address, :lat, :lng, :description, :link_url, :image_url, :location_name, :notes, :visited)
    end
  end
end
