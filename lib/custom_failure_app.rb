# frozen_string_literal: true

class CustomFailureApp < Devise::FailureApp
  def respond
    json_api_error_response
  end

  def json_api_error_response
    self.status = 401
    self.content_type = "application/json"
    Rails.logger.error "Devise failure: #{i18n_message.inspect}"
    self.response_body = {
      error: i18n_message.presence || "Invalid email or password"
    }.to_json
  end
end
