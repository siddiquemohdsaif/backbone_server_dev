class TrophyLeagueConverter {
    static leagueToTrophy(league) {
        switch (league) {
            case '1_1':
                return 0;
            case '1_2':
                return 400;
            case '1_3':
                return 800;
            case '2_1':
                return 1200;
            case '2_2':
                return 1600;
            case '2_3':
                return 2000;
            case '3_1':
                return 2400;
            case '3_2':
                return 2800;
            case '3_3':
                return 3200;
            case '4_1':
                return 3600;
            case '4_2':
                return 4000;
            case '4_3':
                return 4400;
            case '5_1':
                return 4800;
            case '5_2':
                return 5200;
            case '5_3':
                return 5600;
            default:
                //throw new Error(`Unknown league: ${league}`);
                return 0; // avoid error
        }
    }

    static trophyToLeague(trophy) {
        if (trophy >= 0 && trophy < 400) {
            return '1_1';
        } else if (trophy >= 400 && trophy < 800) {
            return '1_2';
        } else if (trophy >= 800 && trophy < 1200) {
            return '1_3';
        } else if (trophy >= 1200 && trophy < 1600) {
            return '2_1';
        } else if (trophy >= 1600 && trophy < 2000) {
            return '2_2';
        } else if (trophy >= 2000 && trophy < 2400) {
            return '2_3';
        } else if (trophy >= 2400 && trophy < 2800) {
            return '3_1';
        } else if (trophy >= 2800 && trophy < 3200) {
            return '3_2';
        } else if (trophy >= 3200 && trophy < 3600) {
            return '3_3';
        } else if (trophy >= 3600 && trophy < 4000) {
            return '4_1';
        } else if (trophy >= 4000 && trophy < 4400) {
            return '4_2';
        } else if (trophy >= 4400 && trophy < 4800) {
            return '4_3';
        } else if (trophy >= 4800 && trophy < 5200) {
            return '5_1';
        } else if (trophy >= 5200 && trophy < 5600) {
            return '5_2';
        } else if (trophy >= 5600) {
            return '5_3';
        } else {
            //throw new Error(`Invalid trophy count: ${trophy}`);
            return '1_1'; // avoid error
        }
    }
}

module.exports = TrophyLeagueConverter;
