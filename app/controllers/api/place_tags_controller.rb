# frozen_string_literal: true

module Api
  class PlaceTagsController < ApplicationController
    before_action :authenticate_user!
    before_action :set_place

    def create
      tag = current_user.tags.find(params.require(:tag_id))
      # Idempotent and race-safe: relies on the unique (place_id, tag_id) index.
      PlaceTag.create_or_find_by!(place: @place, tag: tag)
      render json: @place.reload, status: :ok
    end

    def destroy
      @place.tags.delete(current_user.tags.find(params[:id]))
      render json: @place.reload, status: :ok
    end

    private

    def set_place
      @place = current_user.places.find(params[:place_id])
    end
  end
end
