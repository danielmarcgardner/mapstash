# frozen_string_literal: true

module Api
  class PlacesController < ApplicationController
    before_action :authenticate_user!

    def index
      @places = current_user.places.order(created_at: :desc)
      render json: @places, status: :ok
    rescue ActiveRecord::RecordNotFound
      render json: { error: "Places not found" }, status: :not_found
    end

    def create
      @list = current_user.places.new(place_params)

      if @place.save
        render json: @place, status: :created
      else
        render json: { errors: @place.errors.full_messages }, status: :unprocessable_content
      end
    rescue ActiveRecord::RecordNotFound
      render json: { error: "List not found" }, status: :not_found
    end

    def update
      @place = current_user.places.find(params[:id])
      if @place.update(place_params)
        render json: @place, status: :ok
      else
        render json: { errors: @place.errors.full_messages }, status: :unprocessable_content
      end
    rescue ActiveRecord::RecordNotFound
      render json: { error: "Place not found" }, status: :not_found
    end

    def destroy
      @place = current_user.places.find(params[:id])

      if @place.destroy
        head :no_content
      else
        render json: { errors: @place.errors.full_messages }, status: :unprocessable_content
      end
    rescue ActiveRecord::RecordNotFound
      render json: { error: "Place not found" }, status: :not_found
    end

    private

    def place_params
      params.require(:place).permit(:title, :address, :lat, :lng, :description, :link_url, :image_url, :location_name, :notes, :visited)
    rescue ActionController::ParameterMissing
      render json: { error: "Missing required parameters" }, status: :unprocessable_content
    rescue ActionController::UnpermittedParameters => e
      render json: { error: "Unpermitted parameters: #{e.params.join(', ')}" }, status: :unprocessable_content
    rescue StandardError => e
      render json: { error: "An unexpected error occurred: #{e.message}" }, status: :internal_server_error
    rescue JSON::ParserError
      render json: { error: "Invalid JSON format" }, status: :unprocessable_content
    rescue ActionController::BadRequest
    end
  end
end
