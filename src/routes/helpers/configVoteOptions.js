
function configVoteOptions(defaultOptionsValues, options) {

    try {
        const votes = {};
        const configedOptions = [];

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

        return { configedOptions, votes };
    } catch (error) {
        console.log(error.message);
    }

}

module.exports = { configVoteOptions };
