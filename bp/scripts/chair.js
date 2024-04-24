import { Entity, Player, system, world } from "@minecraft/server";
import * as util from "./util";
import { playerChairData as initializePlayerChairData, sitData } from "./config";

/**
 * イスを削除します
 * @param {Player} player 
 */
export function removeChair(player) {
    system.run(() => {
        const playerChairData = util.getPlayerChairData(player);
        const playerId = player.id;
        const dimensionIds = ["overworld", "nether", "the_end"];

        if (!playerChairData.sit) return;
        for (const dimensionId of dimensionIds) {
            const dimension = world.getDimension(dimensionId);
            const entities = dimension.getEntities({ type: "chair:chair", name: `chair_${playerId}` });

            for (const entity of entities) {
                entity.remove();
            }
        }
    });
}

/**
 * イスを返します
 * @param {Player} player 
 * @returns {Entity | undefined} Entity | undefined
 */
export function getChair(player) {
    const playerId = player.id;
    const playerChairData = util.getPlayerChairData(player);
    const dimensionId = player.dimension.id;

    if (playerChairData.sit) {
        const chair = [...world.getDimension(dimensionId).getEntities({ type: "chair:chair", name: `chair_${playerId}` })][0];

        return chair;
    }

    return undefined;
}

/**
 * イスに座らせます
 * @param {Player} player 
 */
export function startRide(player) {
    system.run(() => {
        const playerChairData = util.getPlayerChairData(player);
        const { x, y, z } = playerChairData.chair;
    
        if (playerChairData.sit) return;
        for (let i = 0; i < sitData.pId.length; i++) {
            if (
                Math.floor(x) === sitData.x[i] &&
                Math.floor(y) === sitData.y[i] &&
                Math.floor(z) === sitData.z[i]
            ) return;
        }

        const playerId = player.id;
        const dimensionId = player.dimension.id;
        const entity = world.getDimension(dimensionId).spawnEntity("chair:chair", playerChairData.chair);
        entity.nameTag = `chair_${playerId}`;
        entity.getComponent("rideable").addRider(player);
        playerChairData.sit = true;
        util.addSitData(player, playerChairData.chair.x, playerChairData.chair.y, playerChairData.chair.z);
        util.setPlayerChairData(player, playerChairData);
    });
}

/**
 * イスから降ろします
 * @param {Player} player 
 */
export function stopRide(player) {
    system.run(() => {
        const playerChairData = util.getPlayerChairData(player);
        const Location = { x: player.location.x, y: player.location.y + 0.5, z: player.location.z };
        const dimension = world.getDimension(player.dimension.id);
    
        if (playerChairData.sit) {
            removeChair(player);
            util.removeSitData(player);
            util.setPlayerChairData(player, initializePlayerChairData);
            player.teleport(Location, { dimension: dimension });
            player.interact = false;
            player.stopRide = false;
        }
    });
}