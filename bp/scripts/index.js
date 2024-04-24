import { system, world } from "@minecraft/server";
import * as util from "./util";
import * as chair from "./chair";
import { playerChairData, selectBlocks } from "./config";

system.run(() => {
    const players = world.getAllPlayers();
    const dimensionIds = ["overworld", "nether", "the_end"];

    for (const dimensionId of dimensionIds) {
        const dimension = world.getDimension(dimensionId);
        const entities = dimension.getEntities({ type: "chair:chair" });

        for (const entity of entities) {
            entity.remove();
        }
    }

    for (const player of players) {
        chair.stopRide(player);
    }
});

world.afterEvents.playerSpawn.subscribe(ev => {
    const { initialSpawn, player } = ev;

    if (initialSpawn) {
        util.setPlayerChairData(player, playerChairData);
    }
})

world.beforeEvents.playerLeave.subscribe(ev => {
    const { player } = ev;

    util.removePlayerChairData(player);
    util.removeSitData(player);
    chair.removeChair(player);
});

world.beforeEvents.chatSend.subscribe(ev => {
    const { sender: player, message } = ev;
    const playerChairData = util.getPlayerChairData(player);

    if (playerChairData.sit && message === "coff") {
        ev.cancel = true;
        chair.removeChair(player);
        chair.stopRide(player);
    }

    if (!playerChairData.sit && message === "sit") {
        ev.cancel = true;

        system.run(() => {
            const dimensionId = player.dimension.id;
            const { x, y, z } = player.location;
            const downblock = world.getDimension(dimensionId).getBlock({ x: x, y: y - 1, z: z });
            const upblock = world.getDimension(dimensionId).getBlock({ x: x, y: y + 1, z: z });
            const playerChairData = util.getPlayerChairData(player);

            if (player.isSneaking) return;
            if (!upblock.isAir) return;
            if (downblock.isAir) return;
            if (player.hasComponent("minecraft:riding")) return;
            if (y > Math.floor(y)) playerChairData.chair = { x: x, y: y - 0.13, z: z };
            else playerChairData.chair = { x: x, y: downblock.y + 0.8, z: z };

            playerChairData.set = player.location;
            util.setPlayerChairData(player, playerChairData);
            chair.startRide(player);
        });
    }
});

world.beforeEvents.playerInteractWithBlock.subscribe(ev => {
    const { block, player } = ev;
    const dimensionId = player.dimension.id;
    const checkBlock = world.getDimension(dimensionId).getBlock({ x: block.x, y: block.y + 1, z: block.z });
    const lastName = block.typeId.split("_")[block.typeId.split("_").length - 1];
    const { x, y, z } = player.location;
    const playerChairData = util.getPlayerChairData(player);
    const Item = player.getComponent("inventory").container.getItem(player.selectedSlot);

    if (player.interact) return;
    if (block.permutation.getAllStates()["minecraft:vertical_helf"] === "top") return;
    if (!selectBlocks.includes(lastName)) return;
    if (player.isSneaking) return;
    if (!checkBlock.isAir) return;
    if (Item) return;

    player.interact = true;
    playerChairData.chair = { x: block.x + 0.5, y: block.y + 0.25, z: block.z + 0.5 };
    playerChairData.set = { x: x, y: parseFloat(y), z: z };
    util.setPlayerChairData(player, playerChairData);
    chair.startRide(player);
});

system.runInterval(() => {
    const players = world.getAllPlayers();

    for (const player of players) {
        try {
            const playerChairData = util.getPlayerChairData(player);

            if (playerChairData.sit) {
                const dimensionId = player.dimension.id;
                const playerChairData = util.getPlayerChairData(player);
                const checkBlock = world.getDimension(dimensionId).getBlock(playerChairData.chair);
                const entity = chair.getChair(player);
                const location = playerChairData.chair;
                const rotation = player.getRotation();
                const dimension = world.getDimension(dimensionId);

                entity.teleport(location, { dimension: dimension });
                entity.setRotation(rotation);

                if (
                    !player.stopRide &&
                    (!player.hasComponent("minecraft:riding") ||
                        checkBlock.isAir)
                ) {
                    player.stopRide = true;
                    chair.stopRide(player);
                    continue;
                }
            }
        } catch {};
    }
});