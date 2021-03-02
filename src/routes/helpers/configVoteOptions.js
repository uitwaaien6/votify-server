
function configVoteOptions(defaultOptionsValues, options) {

    try {
        const votes = {};
        const configedOptions = [];
        const properOptions = [];

        options.forEach((option, index) => {

            const spaceSeperatedOption = option.split(' ');
            const emptyStrCleanedOption = [];

            spaceSeperatedOption.forEach((spaceSeperatedOptionItem) => {

                if (spaceSeperatedOptionItem) {
                    emptyStrCleanedOption.push(spaceSeperatedOptionItem);
                }

            });

            const finalizedOption = emptyStrCleanedOption.join(' ');

            if (finalizedOption) {
                configedOptions.push(finalizedOption);
                votes[finalizedOption] = 0;
            }

        });

        if (configedOptions.length === 0 || configedOptions.length < 1) {
            const defaultOptions = [...defaultOptionsValues];

            defaultOptions.forEach((option, index) => {
                votes[option] = 0;

            });

            return { configedOptions: defaultOptions, votes };
        }

        // avoid overwriting same options in array the object handles by itself by overriding value
        configedOptions.forEach((option, index) => {
            if (!properOptions.includes(option)) {
                properOptions.push(option);
            }
        });

        return { configedOptions: properOptions, votes };
    } catch (error) {
        console.log(error.message);
    }

}

module.exports = { configVoteOptions };
