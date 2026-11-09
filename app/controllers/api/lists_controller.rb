# frozen_string_literal: true

module Api
  class ListsController < ApplicationController
    before_action :authenticate_user!
    before_action :set_list, only: [ :show, :update, :destroy ]

    # GET /api/lists
    def index
      @lists = current_user.lists.includes(:list_places).order(Arel.sql("LOWER(lists.title)"), :id)
      render json: @lists, status: :ok
    end

    # GET /api/lists/:id
    def show
      render json: @list, status: :ok
    end

    # POST /api/lists
    def create
      @list = current_user.lists.build(list_params)

      if @list.save
        render json: @list, status: :created
      else
        render json: { errors: @list.errors.full_messages }, status: :unprocessable_content
      end
    end

    # PATCH/PUT /api/lists/:id
    def update
      if @list.update(list_params)
        render json: @list, status: :ok
      else
        render json: { errors: @list.errors.full_messages }, status: :unprocessable_content
      end
    end

    # DELETE /api/lists/:id
    def destroy
      @list.destroy
      head :no_content
    end

    private

    def set_list
      @list = current_user.lists.find(params[:id])
    end

    def list_params
      params.require(:list).permit(:title, :description)
    end
  end
end
