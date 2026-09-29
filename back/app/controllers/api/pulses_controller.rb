module Api
  class PulsesController < ApplicationController
    def show
      shop = Shop.current
      render json: {
        updated_at: shop.revision_stamp,
        playback_seq: shop.playback_seq,
        playback_index: shop.playback_index,
        playback_paused: shop.playback_paused
      }
    end
  end
end
