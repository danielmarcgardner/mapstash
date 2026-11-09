# frozen_string_literal: true

class RegistrationsController < Devise::RegistrationsController
  respond_to :json

  # override create to skip session use
  def create
    build_resource(sign_up_params)

    resource.save
    if resource.persisted?
      render json: {
        user: UserSerializer.new(resource).as_json,
        token: Warden::JWTAuth::UserEncoder.new.call(resource, :user, nil).first
      }, status: :ok
    else
      render json: {
        errors: resource.errors.full_messages
      }, status: :unprocessable_content
    end
  rescue ActiveRecord::RecordNotUnique
    # A concurrent signup can pass validation and still lose the race to the unique email index.
    render json: { errors: [ "Email has already been taken" ] }, status: :unprocessable_content
  end

  private

  def sign_up_params
    params.require(:user).permit(:email, :password, :password_confirmation, :first_name, :last_name)
  end
end
