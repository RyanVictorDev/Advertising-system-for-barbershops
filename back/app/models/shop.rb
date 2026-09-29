class Shop < ApplicationRecord
  APPEARANCES = %w[dark light].freeze
  PALETTES = %w[ouro vinho floresta oceano].freeze

  has_many :products, -> { order(:position) }, dependent: :destroy
  has_many :playlists, dependent: :destroy
  has_many :playback_commands, dependent: :destroy

  PLAYBACK_ACTIONS = %w[pause play next previous].freeze

  before_validation :normalize_text
  after_save :remember_playlist, if: :saved_change_to_playlist_url?
  after_save :rewind_playback, if: :saved_change_to_playlist_url?

  validates :name, length: { maximum: 42 }
  validates :tagline, length: { maximum: 42 }
  validates :playlist_url, length: { maximum: 500 }
  validate :theme_is_known
  validate :playlist_must_be_recognized
  validate :live_requires_playlist

  def self.current
    first || create!
  rescue ActiveRecord::RecordNotUnique
    first!
  end

  def revision_stamp
    updated_at.iso8601(6)
  end

  def advance_playback!(action)
    with_lock do
      case action
      when "next"
        self.playback_index += 1
        self.playback_paused = false
      when "previous"
        self.playback_index = [ playback_index - 1, 0 ].max
        self.playback_paused = false
      when "pause"
        self.playback_paused = true
      when "play"
        self.playback_paused = false
      else
        raise ArgumentError, action
      end
      self.playback_seq += 1
      save!
    end
    self
  end

  private
    def normalize_text
      self.name = name.to_s.strip
      self.tagline = tagline.to_s.strip
      self.playlist_url = playlist_url.to_s.strip
    end

    def theme_is_known
      errors.add(:base, "Escolha o tema escuro ou o claro.") unless APPEARANCES.include?(appearance)
      errors.add(:base, "Escolha uma paleta da casa.") unless PALETTES.include?(palette)
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

    def rewind_playback
      previous, = saved_change_to_playlist_url
      return if previous.blank? && playback_index.zero? && !playback_paused?

      update_columns(
        playback_index: 0,
        playback_paused: false,
        playback_seq: playback_seq + 1,
        updated_at: Time.current
      )
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
