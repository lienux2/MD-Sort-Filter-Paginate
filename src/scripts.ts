import axios from "axios";

class Country {
    name: string;
    capital: string;
    currency: Currency;
    language: Language;
}

class Currency {
    name: string;
    symbol: string;
}

class Language {
    name: string;
}

class CountryProvider {
    private countries: Country[];

    async getCountries(filter?: CountryFilter): Promise<Country[]> {
        if (this.countries == null) {
            await axios.get<Country[]>('http://localhost:3004/countries')
                .then(response => {
                    this.countries = response.data;
                });
        }
        return filter == null ? this.countries : filter.apply(this.countries);
    }
}

class CountryFilter {
    countryName: string;
    capital: string;
    currencyName: string;
    language: string;

    constructor(countryName: string, capital: string, currencyName: string, language: string) {
        this.countryName = countryName;
        this.capital = capital;
        this.currencyName = currencyName;
        this.language = language;
    }

    apply(countries: Country[]): Country[] {
        return countries.filter((country) => {
            const lowerCaseCountry = country.name.toLowerCase();
            const lowerCaseCapital = country.capital.toLowerCase();
            const lowerCaseCurrency = country.currency.name.toLowerCase();
            const lowerCaseLanguage = country.language.name.toLowerCase();

            if (this.countryName !== '' && lowerCaseCountry.includes(this.countryName.toLowerCase())) {
                return true;
            }
            if (this.capital !== '' && lowerCaseCapital.includes(this.capital.toLowerCase())) {
                return true;
            }
            if (this.currencyName !== '' && lowerCaseCurrency.includes(this.currencyName.toLowerCase())) {
                return true;
            }
            if (this.language !== '' && lowerCaseLanguage.includes(this.language.toLowerCase())) {
                return true;
            }
        })
    }
}

class CountryTableDisplayer {
    table: HTMLTableElement;
    countryProvider: CountryProvider;
    currentDisplay: number = 20;
    loadMoreBtn: HTMLButtonElement;
    searcher: Searcher;
    filter: CountryFilter;
    sorter: Sorter;

    constructor(countryProvider: CountryProvider) {
        this.table = document.querySelector<HTMLTableElement>('.js-table');
        this.countryProvider = countryProvider;
        this.sorter = new Sorter(this.countryProvider, this);
        this.searcher = new Searcher((filter) => {
            this.filter = filter;
            this.refreshTable();
        });
        this.loadMoreBtn = document.querySelector('.js-loadmore-button');
        this.loadMoreBtn.addEventListener('click', () => {
            this.currentDisplay += 20;
            this.refreshTable();
        });
    }

    refreshTable(currentPage = 1) {
        this.table.innerHTML = '';
        this.countryProvider.getCountries(this.filter)

            .then(countries => {
                const startIndex = (currentPage - 1) * this.currentDisplay;
                const endIndex = startIndex + this.currentDisplay;

                countries.slice(0, this.currentDisplay).map((country, index) => {
                    this.table.innerHTML += `
                        <tr>
                            <th scope="row">${index + 1}</th>
                            <td>${country.name}</td>
                            <td>${country.capital}</td>
                            <td>${country.currency.name}</td>
                            <td>${country.currency.symbol}</td>
                            <td>${country.language.name}</td>
                        </tr>
                    `;
                });
            });
    }
}

class Searcher {
    searchBtn: HTMLButtonElement;
    countryInput: HTMLInputElement;
    capitalInput: HTMLInputElement;
    currencyInput: HTMLInputElement;
    languageInput: HTMLInputElement;
    onSearch: SearchCallback;

    constructor(onSearch: SearchCallback) {
        this.searchBtn = document.querySelector<HTMLButtonElement>('.js-search-button');
        this.countryInput = document.querySelector<HTMLInputElement>('input[name=country]');
        this.capitalInput = document.querySelector<HTMLInputElement>('input[name=capital]');
        this.currencyInput = document.querySelector<HTMLInputElement>('input[name=currency]');
        this.languageInput = document.querySelector<HTMLInputElement>('input[name=language]');
        this.onSearch = onSearch;
        this.searchBtn.addEventListener('click', () => {
            let filter = new CountryFilter(
                this.countryInput.value,
                this.capitalInput.value,
                this.currencyInput.value,
                this.languageInput.value,
            );
            if (this.onSearch != null) {
                this.onSearch(filter);
            }
        });
    };
}

class Sorter {
    sortCountryBtn: HTMLButtonElement;
    sortCapitalBtn: HTMLButtonElement;
    sortLanguageBtn: HTMLButtonElement;
    countryTableDisplayer: CountryTableDisplayer;
    countryProvider: CountryProvider;

    constructor(countryProvider: CountryProvider, countryTableDisplayer: CountryTableDisplayer) {
        this.countryProvider = countryProvider;
        this.countryTableDisplayer = countryTableDisplayer;
        this.sortCountryBtn = document.querySelector<HTMLButtonElement>('.js-sort-country');
        this.sortCountryBtn.addEventListener('click', () => {
            this.sortTable('name');
        });
        this.sortCapitalBtn = document.querySelector<HTMLButtonElement>('.js-sort-capital');
        this.sortCapitalBtn.addEventListener('click', () => {
            this.sortTable('capital');
        });
        this.sortLanguageBtn = document.querySelector<HTMLButtonElement>('.js-sort-language');
        this.sortLanguageBtn.addEventListener('click', () => {
            this.sortTable('language.name');
        });
    }

    sortTable(sortBy: string) {
        this.countryProvider.getCountries().then(countries => {
            countries.sort((a, b) => {
                const valueA = this.getSortByValue(a, sortBy);
                const valueB = this.getSortByValue(b, sortBy);

                if (valueA < valueB) {
                    return -1;
                } else if (valueA > valueB) {
                    return 1;
                } else {
                    return 0;
                }
            });
            this.countryTableDisplayer.refreshTable();
        });
    }

    getSortByValue(obj: any, path: string): any {
        const values = path.split('.');
        return values.reduce((acc, current) => acc[current], obj);
    }
}

type SearchCallback = (filter: CountryFilter) => void;

document.addEventListener('DOMContentLoaded', async () => {
    let countryProvider = new CountryProvider();
    let displayer = new CountryTableDisplayer(countryProvider);
    displayer.refreshTable();
});