class PlaybackCommand < ApplicationRecord
  ACTIONS = %w[pause play next previous].freeze
  KEEP = 30
  FRESH_FOR = 20.seconds

  belongs_to :shop

  validates :action, inclusion: { in: ACTIONS }
  validates :seq, presence: true, numericality: { only_integer: true, greater_than: 0 }

  def self.issue!(shop, action)
    shop.with_lock do
      seq = where(shop_id: shop.id).maximum(:seq).to_i + 1
      command = create!(shop: shop, seq: seq, action: action)
      where(shop_id: shop.id).where(seq: ..(seq - KEEP)).delete_all
      command
    end
  end

  def self.pending(shop, after:)
    scope = where(shop_id: shop.id)
    current = scope.maximum(:seq).to_i
    commands = if after.nil?
      scope.none
    else
      scope.where("seq > ?", after).where(created_at: FRESH_FOR.ago..).order(:seq).limit(20)
    end
    { seq: current, commands: commands }
  end
end
