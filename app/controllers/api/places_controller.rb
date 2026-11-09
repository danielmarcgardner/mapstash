# frozen_string_literal: true

module Api
  class PlacesController < ApplicationController
    before_action :authenticate_user!
    before_action :set_place, only: %i[show update destroy]

    def index
      @places = current_user.places.includes(:tags, :list_places).order(created_at: :desc)
      render json: @places, status: :ok
    end

    def show
      render json: @place, status: :ok
    end

    def create
      @place = current_user.places.new
      save_place(:created)
    end

    def update
      save_place(:ok)
    end

    def destroy
      @place.destroy!
      head :no_content
    end

    private

    def set_place
      @place = current_user.places.find(params[:id])
    end

    # Join rows on a saved place are written on assignment, so everything happens in one transaction;
    # save! or owned! raising RecordInvalid rolls it back and ApplicationController renders the 422.
    def save_place(status)
      attrs = place_params
      tags = owned!(current_user.tags, attrs.delete(:tag_ids), :tag_ids) if attrs.key?(:tag_ids)
      lists = owned!(current_user.lists, attrs.delete(:list_ids), :list_ids) if attrs.key?(:list_ids)

      Place.transaction do
        @place.assign_attributes(attrs)
        @place.tags = tags if tags
        @place.lists = lists if lists
        @place.save!
      end
      render json: @place, status: status
    end

    # Records for ids the current user owns; any unknown or foreign id is a 422.
    def owned!(scope, ids, attribute)
      ids = ids.compact_blank.uniq
      records = scope.where(id: ids).to_a
      return records if records.size == ids.size

      @place.errors.add(attribute, "must all belong to you")
      raise ActiveRecord::RecordInvalid, @place
    end

    def place_params
      params.require(:place).permit(:title, :address, :lat, :lng, :description, :link_url, :image_url, :location_name, :notes, :visited,
                                    :google_place_id, tag_ids: [], list_ids: [])
    end
  end
end
