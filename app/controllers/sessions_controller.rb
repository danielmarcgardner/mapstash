# frozen_string_literal: true

class SessionsController < Devise::SessionsController
  respond_to :json

  def create
    user = User.find_by(email: sign_in_params[:email])

    if user&.valid_password?(sign_in_params[:password])
      warden.set_user(user)  # ✅ JWT will be dispatched here
      render json: { user: user, token: request.env["warden-jwt_auth.token"] }, status: :ok
    else
      render json: { error: "Invalid email or password" }, status: :unauthorized
    end
  end

  private

  def sign_in_params
    permitted = params.require(:user).permit(:email, :password)
    Rails.logger.debug "Sign in params: #{permitted.inspect}"
    permitted
  end

  def respond_to_on_destroy
    head :no_content
  end
end
