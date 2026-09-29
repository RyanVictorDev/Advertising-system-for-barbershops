module Api
  class PlaybacksController < ApplicationController
    def create
      action = params.expect(playback: [ :action ])[:action].to_s
      unless Shop::PLAYBACK_ACTIONS.include?(action)
        render json: { errors: [ "Esse comando de reprodução não existe." ] }, status: :unprocessable_entity
        return
      end

      shop = Shop.current
      shop.advance_playback!(action)
      render json: { seq: shop.playback_seq, index: shop.playback_index, paused: shop.playback_paused }
    end
  end
end
