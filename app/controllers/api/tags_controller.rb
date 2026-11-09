
module Api
  class TagsController < ApplicationController
    before_action :authenticate_user!

    def index
      @tags = Tags.all
      render json: @tags, status: :ok
    end

    def create
      @tag = current_user.tags.build(tag_params)

      if @tag.save
        render json: @tag, status: :created
      else
        render json: { errors: @tag.errors.full_messages }, status: :unprocessable_content
      end
    end

    def add_tag_to_place
      @tag = current_user.tags.find(params[:tag_id])
      @place = current_user.places.find(params[:place_id])

      if @place.tags << @tag
        render json: { message: "Tag added to place successfully" }, status: :ok
      else
        render json: { errors: @place.errors.full_messages }, status: :unprocessable_content
      end
    end

    def remove_tag_from_place
      @tag = current_user.tags.find(params[:tag_id])
      @place = current_user.places.find(params[:place_id])
      if @place.tags.delete(@tag)
        render json: { message: "Tag removed from place successfully" }, status: :ok
      else
        render json: { errors: @place.errors.full_messages }, status: :unprocessable_content
      end
    end

    private

    def tag_params
      params.require(:tag).permit(:name, :color)
    end
  end
end
