const rp = require('request-promise');
const cheerio = require('cheerio');
const getAccountByName = require('./getaccountbyname');

const regPathFix = {
    pc: '/career/pc/',
    xbl: '/career/xbl/',
    psn: '/career/psn/'
};

async function getRawHtmlFromBtag(btag, platform) {
    try {
        if (platform !== undefined && regPathFix[platform] == undefined) {
            throw new TypeError(`${platform} is not a valid platform`);
        }
        let uri = `https://playoverwatch.com/en-us${regPathFix[platform]}${encodeURIComponent(btag.replace('#', '-'))}`;

        if (platform === undefined) {
            const accountData = await getAccountByName(btag).catch((err) => {
                throw err;
            });

            if (accountData[0].visibility.isPrivate === true || accountData[0].visibility.isFriendsOnly === true) {
                throw 'ACCOUNT_PRIVATE';
            }

            uri = `https://playoverwatch.com/en-us/career/${accountData[0].platform}/${accountData[0].urlName}`;
        }

        const options = {
            uri,
            timeout: 10000
        };
        
        const getProfileData = await rp(options)
        .then(function (htmlString) {
            if (htmlString.search("Profile Not Found") !== -1) {
                throw 'PLAYER_NOT_EXIST';
            } else if (htmlString.search("I Need Healing") !== -1) {
                throw 'API_DOWN';
            } else {
                return htmlString;
            }
        })
        .catch((err) => {
            if (err.statusCode === 404) {
                throw 'PLAYER_NOT_EXIST';
            } else {
                throw err;
            }
        });

        const accountData = await getAccountByName(btag).catch((err) => {
            throw err;
        });

        if (accountData[0].isPublic === false) {
            throw 'ACCOUNT_PRIVATE';
        }

        return getProfileData;
    } catch(e) {
        throw e;
    }
}

module.exports = getRawHtmlFromBtag;
