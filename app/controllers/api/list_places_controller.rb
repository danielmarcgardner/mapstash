# frozen_string_literal: true

module Api
  class ListPlacesController < ApplicationController
    before_action :authenticate_user!

    def create
      @list = current_user.lists.find(params[:list_id])
      @place = @list.places.build(place_params)

      if @place.save
        render json: @place, status: :created
      else
        render json: { errors: @place.errors.full_messages }, status: :unprocessable_entity
      end
    rescue ActiveRecord::RecordNotFound
      render json: { error: "List not found" }, status: :not_found
    end

    def destroy
      @list = current_user.lists.find(params[:list_id])
      @place = @list.places.find(params[:id])

      if @place.destroy
        head :no_content
      else
        render json: { errors: @place.errors.full_messages }, status: :unprocessable_entity
      end
    rescue ActiveRecord::RecordNotFound
      render json: { error: "List or Place not found" }, status: :not_found
    end

    private

    def place_params
      params.require(:place).permit(:name, :address, :lat, :lng, :description)
    end
  end
end
