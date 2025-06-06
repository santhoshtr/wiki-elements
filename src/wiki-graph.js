import { addScript, html } from "./common.js";
import LazyLoadMixin from "./mixins/LazyLoadMixin.js";
import WikiElement from "./wiki-element.js";

const URLs = {
	echarts: "https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js",
};

let echarts = window.echarts;

class WikiGraph extends LazyLoadMixin(WikiElement) {
	static get template() {
		return html` <div class="wiki-graph" style="width: 100%;height:100%;min-height:500px;"></div> `;
	}

	static get properties() {
		return {
			source: {
				type: String,
			},
			theme: {
				type: String,
				options: ["light", "dark"],
				default: "light",
			},
		};
	}

	render() {
		// Source example: "https://commons.wikimedia.org/wiki/Data:COVID-19_cases_in_Santa_Clara_County,_California.tab"
		// from the source get the article name
		const url = new URL(this.source);
		this.article = url.pathname.split("/wiki/").pop();
		this.hostname = url.hostname;
		this.title = this.article.split(".")[0].replace(/_/g, " ");
		this.fetchGraphData().then((graphData) => this.renderGraph(graphData));
	}

	get apiURL() {
		return `https://${this.hostname}/w/api.php?action=query&prop=revisions&rvprop=content&titles=${encodeURIComponent(this.article)}&format=json&formatversion=2&origin=*`;
	}

	async renderGraph(graphData) {
		if (!echarts) {
			await addScript(URLs.echarts);
			echarts = window.echarts;
		}

		const wikigraph = echarts.init(
			this.shadowRoot.querySelector(".wiki-graph"),
			this.theme,
			{ renderer: "svg" },
		);
		const xAxisLabels = [];
		const yAxisLabels = [];
		for (let i = 0; i < graphData.schema.fields.length; i++) {
			if (i === 0) {
				xAxisLabels.push(
					graphData.schema.fields[i].title?.en ||
						graphData.schema.fields[i].name,
				);
			} else {
				yAxisLabels.push(
					graphData.schema.fields[i].title?.en ||
						graphData.schema.fields[i].name,
				);
			}
		}
		const xAxisData = [];
		const yAxisData = [];
		for (let i = 0; i < graphData.data.length; i++) {
			xAxisData.push(graphData.data[i][0]);
			yAxisData.push(graphData.data[i].slice(1));
		}
		const series = [];
		for (let i = 0; i < yAxisLabels.length; i++) {
			const ydata = [];
			for (let j = 0; j < yAxisData.length; j++) {
				ydata.push(yAxisData[j][i]);
			}
			series.push({
				name: yAxisLabels[i],
				type: "line",
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
				type: "scroll",
				orient: "horizontal",
				top: "bottom",
			},

			xAxis: {
				data: xAxisData,
			},
			yAxis: {},
			series: series,
			dataZoom: [],
			toolbox: {
				show: true,
				feature: {
					//     dataZoom: {
					//         yAxisIndex: 'none'
					//     },
					dataView: { readOnly: true },
					magicType: { type: ["line", "bar"] },
					restore: {},
					saveAsImage: {},
				},
			},
		};

		// Display the chart using the configuration items and data just specified.
		wikigraph.setOption(option);
		window.addEventListener("resize", wikigraph.resize);
	}

	async fetchGraphData() {
		try {
			const response = await fetch(this.apiURL);
			if (!response.ok) {
				throw new Error("Network response was not ok");
			}
			const data = await response.json();
			return JSON.parse(data.query.pages[0]?.revisions[0]?.content);
		} catch (error) {
			console.error("Fetch error:", error);
		}
	}
}

customElements.define("wiki-graph", WikiGraph);
