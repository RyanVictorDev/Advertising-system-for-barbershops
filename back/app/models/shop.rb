class Shop < ApplicationRecord
  has_many :products, -> { order(:position) }, dependent: :destroy
  has_many :playlists, dependent: :destroy

  before_validation :normalize_text
  after_save :remember_playlist, if: :saved_change_to_playlist_url?

  validates :name, length: { maximum: 42 }
  validates :tagline, length: { maximum: 42 }
  validates :playlist_url, length: { maximum: 500 }
  validate :playlist_must_be_recognized
  validate :live_requires_playlist

  def self.current
    first || create!
  rescue ActiveRecord::RecordNotUnique
    first!
  end

  private
    def normalize_text
      self.name = name.to_s.strip
      self.tagline = tagline.to_s.strip
      self.playlist_url = playlist_url.to_s.strip
    end

    def playlist_must_be_recognized
      return if playlist_url.blank?
      return if Youtube::PlaylistId.extract(playlist_url)

      errors.add(:base, "Não encontrei o código da playlist nesse link.")
    end

    def live_requires_playlist
      return unless live?
      return if Youtube::PlaylistId.extract(playlist_url)

      errors.add(:base, "Cole o link de uma playlist para abrir.")
    end

    def remember_playlist
      youtube_id = Youtube::PlaylistId.extract(playlist_url)
      return if youtube_id.blank?

      playlist = playlists.find_or_initialize_by(youtube_id: youtube_id)
      playlist.url = playlist_url
      playlist.last_selected_at = Time.current
      fetched = Youtube::PlaylistTitle.fetch(youtube_id)
      playlist.title = fetched if fetched.present?
      playlist.save!
    end
end
