class SalonSerializer
  def initialize(shop)
    @shop = shop
  end

  def as_json
    {
      shop_name: @shop.name,
      tagline: @shop.tagline,
      playlist_url: @shop.playlist_url,
      live: @shop.live,
      appearance: @shop.appearance,
      palette: @shop.palette,
      products: @shop.products.map { |product| ProductSerializer.new(product).as_json },
      playlists: Playlist.with_titles(@shop.playlists.recent.limit(20)).map { |playlist| PlaylistSerializer.new(playlist).as_json }
    }
  end
end
