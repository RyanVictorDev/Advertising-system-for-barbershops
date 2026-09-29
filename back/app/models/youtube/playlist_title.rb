require "cgi"
require "net/http"
require "uri"

module Youtube
  # O feed público da playlist traz o nome no primeiro <title>.
  # Não precisa de chave. Se o YouTube não responder, a lista segue com o link.
  class PlaylistTitle
    FEED = "https://www.youtube.com/feeds/videos.xml"

    def self.fetch(youtube_id)
      return if youtube_id.blank?
      return if Rails.env.test?

      uri = URI(FEED)
      uri.query = URI.encode_www_form(playlist_id: youtube_id)
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = true
      http.open_timeout = 4
      http.read_timeout = 4

      request = Net::HTTP::Get.new(uri)
      request["User-Agent"] = "OSalao/1.0"
      response = http.request(request)
      return unless response.is_a?(Net::HTTPSuccess)

      extract(response.body.to_s)
    rescue StandardError
      nil
    end

    def self.extract(xml)
      match = xml.to_s.match(%r{<title>(.*?)</title>}m)
      return if match.nil?

      CGI.unescapeHTML(match[1]).strip.presence&.slice(0, 200)
    end
  end
end
