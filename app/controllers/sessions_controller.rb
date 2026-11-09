# frozen_string_literal: true

class SessionsController < Devise::SessionsController
  respond_to :json

  def create
    user = User.find_by(email: sign_in_params[:email])

    if user&.valid_password?(sign_in_params[:password])
      warden.set_user(user)  # ✅ JWT will be dispatched here
      render json: { user: UserSerializer.new(user).as_json, token: request.env["warden-jwt_auth.token"] }, status: :ok
    else
      render json: { errors: [ "Invalid email or password" ] }, status: :unauthorized
    end
  end

  private

  def sign_in_params
    params.require(:user).permit(:email, :password)
  end

  def respond_to_on_destroy
    head :no_content
  end
end
