
module Api
  class TagsController < ApplicationController
    before_action :authenticate_user!
    before_action :set_tag, only: %i[update destroy]

    def index
      @tags = current_user.tags.left_joins(:place_tags).group(:id)
                          .select("tags.*, COUNT(place_tags.id) AS places_count")
                          .order(Arel.sql("LOWER(tags.name)"))
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

    def update
      if @tag.update(tag_params)
        render json: @tag, status: :ok
      else
        render json: { errors: @tag.errors.full_messages }, status: :unprocessable_content
      end
    end

    def destroy
      @tag.destroy!
      head :no_content
    end

    private

    def set_tag
      @tag = current_user.tags.find(params[:id])
    end

    def tag_params
      params.require(:tag).permit(:name, :color)
    end
  end
end
