# frozen_string_literal: true

class RegistrationsController < Devise::RegistrationsController
  respond_to :json

  # override create to skip session use
  def create
    build_resource(sign_up_params)

    resource.save
    if resource.persisted?
      render json: {
        user: resource,
        token: Warden::JWTAuth::UserEncoder.new.call(resource, :user, nil).first
      }, status: :ok
    else
      render json: {
        error: resource.errors.full_messages
      }, status: :unprocessable_content
    end
  end

  private

  def sign_up_params
    params.require(:user).permit(:email, :password, :password_confirmation, :first_name, :last_name)
  end
end
