/*
 * Generic MTT script suitable for stacks up to approx. 40bb
 *
 * The script is based on Harambee's suggestion:
 * https://forumserver.twoplustwo.com/showpost.php?p=57356886&postcount=1122
 * 
 * Only SB can complete/limp
 * 
 * Shows:
 * - Configurable flats for each bet number
 * - Multiple opening / 3bet / squeeze sizes
 * - Separate sizings for SB / BB
 * - Adjusting squeeze sizing based on # flat calls
 * - All-in threshold
 */

let ALLIN = 9999;

//Preflop open sizing in big blinds
let SIZES_OPEN_OTHERS = [2.3];
let SIZES_OPEN_BU = [2.3, ALLIN];
let SIZES_OPEN_SB = [3.5, ALLIN];
let SIZES_OPEN_BB = [3.5, ALLIN];

//general 3-bet sizing
let SIZES_3BET_IP = [6.9, ALLIN];
let SIZES_3BET_BB_VS_SB = [9.0, ALLIN];
let SIZES_3BET_BB_VS_OTHER = [9.2, ALLIN];
let SIZES_3BET_SB_VS_BB = [9.2, ALLIN];
let SIZES_3BET_SB_VS_OTHER = [8.1, ALLIN];

//special sizing for squeezes
let SIZES_3BET_SQUEEZE_IP = [9.2, ALLIN];
let SIZES_3BET_SQUEEZE_SB = [10.35, ALLIN];
let SIZES_3BET_SQUEEZE_BB = [11.5, ALLIN];
let SQUEEZE_INCREASE_PER_CALL = 2.0; //added to squeeze size for multiple callers

//All-In threshold, works like the UI version
let PREFLOP_ALLIN_THRESHOLD = 0.37;

//Flatting rules
let ALLOWED_FLATS_PER_RAISE = [
				2, //flats against opens 
				1, //against 3-bets
				1, //4-bets
				0, //5-bets
				0  //6-bets
				];

//Postflop Betting, these settings work exactly as the ones in the UI
let POSTFLOP_MAX_PLAYERS_LIVE = 3;
let POSTFLOP_PRIMARY_HINT = 0.75;
let POSTFLOP_SECONDARY_HINT = null;
let POSTFLOP_ADD_ALLIN = true;

/*
 * The actual scripting starts below
 */

function getSizingsPreflop(ctx) {
	let bets = 1 + ctx.getBetCount();
	let sizings = [];
	switch (bets) {
		case 2: //opening
			sizings = getSizingsOpening(ctx); break;
		case 3: //3-bets
			sizings = getSizings3Bets(ctx); break;
		default: //4-bets+
			return ctx.sizingAllIn();
	}
	return applyAllinThreshold(ctx, sizings);
}

function applyAllinThreshold(ctx, sizings) {
	let sizeallin = ctx.sizingAllIn();
	let activechips = ctx.getPotState().getChipsActive(ctx.getActivePlayer());
	let thresholdchips = activechips +
		(sizeallin - activechips) * PREFLOP_ALLIN_THRESHOLD;
	return sizings.map(s => s >= thresholdchips ? sizeallin : s);
}

function getSizingsOpening(ctx) {
	let player = ctx.getActivePlayer();

	if (player == ctx.getPlayerIndexButton()) //BU
		return SIZES_OPEN_BU.map(s => ctx.sizingBigBlinds(s));
	if (player == ctx.getPlayerIndexSmallBlind()) //SB
		return SIZES_OPEN_SB.map(s => ctx.sizingBigBlinds(s));
	if (player == ctx.getPlayerIndexBigBlind()) //BB
		return SIZES_OPEN_BB.map(s => ctx.sizingBigBlinds(s));

	return SIZES_OPEN_OTHERS.map(s => ctx.sizingBigBlinds(s));
}

function getSizings3Bets(ctx) {
	let player = ctx.getActivePlayer();
	let raiser = ctx.getLastRaiseAction().getPlayer();

	let inposition = ctx.isPlayerInPosition(player, raiser);
	let callers = ctx.getFlatCallCount();
	
	if(callers > 0)
		return getSizingsSqueeze(ctx, player, callers);
	if (player == ctx.getPlayerIndexSmallBlind()) { //Special rules for SB
		if (raiser == ctx.getPlayerIndexBigBlind())
			return SIZES_3BET_SB_VS_BB.map(s => ctx.sizingBigBlinds(s)); //sb vs bb iso
		return SIZES_3BET_SB_VS_OTHER.map(s => ctx.sizingBigBlinds(s)); //other sb 3bets
	}
	if (player == ctx.getPlayerIndexBigBlind()) { //Special rules for BB
		if (raiser == ctx.getPlayerIndexSmallBlind())
			return SIZES_3BET_BB_VS_SB.map(s => ctx.sizingBigBlinds(s)); //bb vs sb rfi
		return SIZES_3BET_BB_VS_OTHER.map(s => ctx.sizingBigBlinds(s)); //other bb 3bets
	}

	return SIZES_3BET_IP.map(s => ctx.sizingBigBlinds(s)); //3bets for the other players
}

function getSizingsSqueeze(ctx, player, callers){
	let sizings = SIZES_3BET_SQUEEZE_IP;
	if(player == ctx.getPlayerIndexSmallBlind())
		sizings = SIZES_3BET_SQUEEZE_SB;
	if(player == ctx.getPlayerIndexBigBlind())
		sizings = SIZES_3BET_SQUEEZE_BB;
	return sizings.map(s => ctx.sizingBigBlinds(s + SQUEEZE_INCREASE_PER_CALL * (callers - 1)));
}

function getSizingsPostflop(ctx) {
	let sizings = [ctx.sizingGeometricHint(POSTFLOP_PRIMARY_HINT)];
	if (POSTFLOP_ADD_ALLIN)
		sizings.push(ctx.sizingAllIn());
	if (POSTFLOP_SECONDARY_HINT !== null && ctx.getPotState().countPlayersLive() <= 2)
		sizings.push(ctx.sizingGeometricHint(POSTFLOP_SECONDARY_HINT));
	return sizings;
}

function canFlatCallPreflop(ctx) {
	let bets = ctx.getBetCount();
	if (bets == 1) //only SB is allowed to complete
		return ctx.getActivePlayer() == ctx.getPlayerIndexSmallBlind();

	if (bets - 2 >= ALLOWED_FLATS_PER_RAISE.length)
		return false;
	else
		return ctx.getFlatCallCount() < ALLOWED_FLATS_PER_RAISE[bets - 2];
}

function hasNextStreetBetting(ctx) {
	return ctx.getPotState().countPlayersLive() <= POSTFLOP_MAX_PLAYERS_LIVE;
}

