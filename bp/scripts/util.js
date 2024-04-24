import { Player } from "@minecraft/server";
import { sitData } from "./config";

/**
 * PlayerChairDataを取得します
 * @param {Player} player 
 * @returns {any} playerChairData
 */
export function getPlayerChairData(player) {
    const playerChairDataString = player.getDynamicProperty("playerChairData");
    return JSON.parse(playerChairDataString);
}

/**
 * PlayerChairDataをセットします
 * @param {Player} player 
 * @param {any} playerChairData
 */
export function setPlayerChairData(player, playerChairData) {
    player.setDynamicProperty("playerChairData", JSON.stringify(playerChairData));
}

/**
 * PlayerChairDataを削除します
 * @param {Player} player 
 */
export function removePlayerChairData(player) {
    player.setDynamicProperty("playerChairData", undefined);
}

/**
 * sitDataから指定したプレイヤーの番号を取得します
 * @param {Player} player 
 * @returns {number} number
 */
export function getSitData(player) {
    const playerId = player.id;

    return sitData.pId.indexOf(playerId);
}

/**
 * sitDataに値を追加します
 * @param {Player} player 
 * @param {number} x
 * @param {number} y
 * @param {number} z
 */
export function addSitData(player, x, y, z) {
    const playerId = player.id;
    const dimensionId = player.dimension.id;

    if (hasSitData(player)) return;
    sitData.dimensionId.push(dimensionId);
    sitData.x.push(x);
    sitData.y.push(y);
    sitData.z.push(z);
    sitData.pId.push(playerId);
}

/**
 * sitDataに指定したプレイヤーの値が入っているかを検知します
 * @param {Player} player 
 * @returns {boolean} boolean
 */
export function hasSitData(player) {
    const playerId = player.id;

    return sitData.pId.includes(playerId);
}

/**
 * sitDataから指定したプレイヤーのデータを削除します
 * @param {Player} player 
 */
export function removeSitData(player) {
    if (!hasSitData(player)) return;

    const i = getSitData(player);

    sitData.dimensionId.splice(i, 1);
    sitData.x.splice(i, 1);
    sitData.y.splice(i, 1);
    sitData.z.splice(i, 1);
    sitData.pId.splice(i, 1);
}