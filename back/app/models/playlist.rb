class Playlist < ApplicationRecord
  belongs_to :shop

  validates :url, presence: true, length: { maximum: 500 }
  validates :youtube_id, presence: true, uniqueness: { scope: :shop_id }
  validates :title, length: { maximum: 200 }, allow_blank: true

  scope :recent, -> { order(last_selected_at: :desc) }

  def self.search(query)
    term = "%#{sanitize_sql_like(query.to_s.strip)}%"
    where("url ILIKE :term OR youtube_id ILIKE :term OR title ILIKE :term", term: term)
  end

  def self.with_titles(relation)
    relation.to_a.each(&:remember_title)
  end

  def remember_title
    return if title.present?

    fetched = Youtube::PlaylistTitle.fetch(youtube_id)
    update!(title: fetched) if fetched.present?
  end

  def select!
    shop.update!(playlist_url: url)
  end
end
