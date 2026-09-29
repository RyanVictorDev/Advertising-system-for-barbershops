module Api
  class PlaylistsController < ApplicationController
    def index
      playlists = Shop.current.playlists.recent
      playlists = playlists.search(params[:q]) if params[:q].present?
      render json: Playlist.with_titles(playlists.limit(20)).map { |playlist| PlaylistSerializer.new(playlist).as_json }
    end

    def select
      playlist = Shop.current.playlists.find(params[:id])
      playlist.select!
      render_salon(Shop.current)
    end
  end
end
