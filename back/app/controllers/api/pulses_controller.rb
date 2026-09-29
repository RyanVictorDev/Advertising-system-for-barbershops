module Api
  class PulsesController < ApplicationController
    def show
      shop = Shop.current
      raw = params[:after].presence
      after = nil
      if raw
        after = Integer(raw, exception: false)
        if after.nil? || after.negative?
          render json: { errors: [ "Não entendi a posição da reprodução." ] }, status: :unprocessable_entity
          return
        end
      end

      pulse = PlaybackCommand.pending(shop, after: after)
      render json: {
        updated_at: shop.revision_stamp,
        playback_seq: pulse[:seq],
        commands: pulse[:commands].map { |command| { seq: command.seq, action: command.action } }
      }
    end
  end
end
