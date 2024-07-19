import { addScript } from './common.js';

const URLs = {
    echarts: 'https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js',
};

let echarts = window.echarts;

const template = `
<div class="wiki-graph" style="width: 100%;height:100%;min-height:500px;"></div>
`
class WikiGraph extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' }).innerHTML = template;
        this.intersectionObserver = new IntersectionObserver(this.onIntersection.bind(this), {
            root: null,
            rootMargin: '0px',
            threshold: 0.1,
        });
    }

    static get observedAttributes() {
        return ['source'];
    }

    attributeChangedCallback(attrName, oldValue, newValue) {
        if (newValue && oldValue && newValue !== oldValue) {
            console.log('attributeChangedCallback', attrName, newValue, oldValue);
            this[attrName] = newValue;
            this.init();
            this.render();
        }
    }

    onIntersection(entries) {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                this.intersectionObserver.unobserve(this);
                this.init();
                this.render();
            }
        });
    }

    disconnectedCallback() {
        this.intersectionObserver.unobserve(this);
    }

    init() {
        // Source example: "https://commons.wikimedia.org/wiki/Data:COVID-19_cases_in_Santa_Clara_County,_California.tab"
        // from the source get the article name
        const url = new URL(this.source);
        this.article = url.pathname.split('/wiki/').pop();
        this.hostname = url.hostname;

        this.title = this.article.split('.')[0].replace(/_/g, ' ');
    }

    render() {
        this.fetchGraphData().then((graphData) => this.renderGraph(graphData));
    }

    connectedCallback() {
        this.source = this.getAttribute('source');
        this.init();
        this.intersectionObserver.observe(this);
    }

    get apiURL() {
        return `https://${this.hostname}/w/api.php?action=query&prop=revisions&rvprop=content&titles=${encodeURIComponent(this.article)}&format=json&formatversion=2&origin=*`;
    }

    async renderGraph(graphData) {
        if (!echarts) {
            await addScript(URLs.echarts);
            echarts = window.echarts;
        }

        var wikigraph = echarts.init(this.shadowRoot.querySelector('.wiki-graph'));
        let xAxisLabels = [];
        let yAxisLabels = [];
        for (let i = 0; i < graphData.schema.fields.length; i++) {
            if (i == 0) {
                xAxisLabels.push(graphData.schema.fields[i].title?.en || graphData.schema.fields[i].name);
            } else {
                yAxisLabels.push(graphData.schema.fields[i].title?.en || graphData.schema.fields[i].name);
            }
        }
        let xAxisData = [];
        let yAxisData = [];
        for (let i = 0; i < graphData.data.length; i++) {
            xAxisData.push(graphData.data[i][0]);
            yAxisData.push(graphData.data[i].slice(1));
        }
        const series = [];
        for (let i = 0; i < yAxisLabels.length; i++) {
            let ydata = [];
            for (let j = 0; j < yAxisData.length; j++) {
                ydata.push(yAxisData[j][i]);
            }
            series.push({
                name: yAxisLabels[i],
                type: 'line',
                data: ydata,
            });
        }
        // Specify the configuration items and data for the chart
        const option = {
            title: {
                text: graphData.description?.en || this.title,
            },
            tooltip: {},
            legend: {
                data: yAxisLabels,
                type: 'scroll',
                orient: 'horizontal',
                top: 'bottom',
            },

            xAxis: {
                data: xAxisData,
            },
            yAxis: {},
            series: series,
            dataZoom: [],
        };

        // Display the chart using the configuration items and data just specified.
        wikigraph.setOption(option);
        window.addEventListener('resize', wikigraph.resize);
    }
    async fetchGraphData() {
        try {
            const response = await fetch(this.apiURL);
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            return JSON.parse(data.query.pages[0]?.revisions[0]?.content);
        } catch (error) {
            console.error('Fetch error:', error);
        }
    }

}

customElements.define('wiki-graph', WikiGraph);
