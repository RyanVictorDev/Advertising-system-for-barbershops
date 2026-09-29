class PlaylistSerializer
  def initialize(playlist)
    @playlist = playlist
  end

  def as_json
    {
      id: @playlist.id.to_s,
      url: @playlist.url,
      youtube_id: @playlist.youtube_id,
      title: @playlist.title,
      last_selected_at: @playlist.last_selected_at
    }
  end
end
