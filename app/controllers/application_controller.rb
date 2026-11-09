class ApplicationController < ActionController::API
  rescue_from ActiveRecord::RecordNotFound do |e|
    render_errors [ "#{e.model || 'Record'} not found" ], :not_found
  end

  rescue_from ActiveRecord::RecordInvalid do |e|
    render_errors e.record.errors.full_messages, :unprocessable_content
  end

  rescue_from ActionController::ParameterMissing do |e|
    render_errors [ e.message ], :bad_request
  end

  private

  def render_errors(messages, status)
    render json: { errors: messages }, status: status
  end
end
