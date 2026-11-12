# Serves the built React app (public/index.html) for client-side routes such as /login.
class FrontendController < ActionController::API
  def index
    send_file Rails.public_path.join("index.html"), type: "text/html", disposition: "inline"
  end
end
