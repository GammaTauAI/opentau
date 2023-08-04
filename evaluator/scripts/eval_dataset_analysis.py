import datasets
import statistics
import matplotlib.pyplot as plt

ds = datasets.load_dataset("nuprl/ts-eval", split="test")


lengths = []

for ex in ds:
    lengths.append(len(ex["content"]))

plt.hist(lengths, bins=100)
plt.xlabel('Example Length')
plt.ylabel('Number of Examples')
plt.title('Distribution of Example Lengths')
# more ticks on x-axis
plt.locator_params(axis='x', nbins=20)
# add 2000 tick
plt.xticks(list(plt.xticks()[0]) + [2000])
# rotate x-axis labels
plt.xticks(rotation=45)
plt.savefig('eval_dataset_analysis_hist.png')
plt.savefig('eval_dataset_analysis_hist.pdf')

# cdf
plt.clf()
plt.hist(lengths, bins=100, cumulative=True, density=True)
plt.xlabel('Example Length')
plt.ylabel('Cumulative Probability')
plt.title('Cumulative Distribution of Example Lengths')
# more ticks on x-axis
plt.locator_params(axis='x', nbins=20)
# add 2000 tick
plt.xticks(list(plt.xticks()[0]) + [2000])
# rotate x-axis labels
plt.xticks(rotation=45)
plt.savefig('eval_dataset_analysis_cdf.png')
plt.savefig('eval_dataset_analysis_cdf.pdf')


# Print some statistics
print("Number of examples: ", len(lengths))
print("Average length: ", sum(lengths) / len(lengths))
print("Max length: ", max(lengths))
print("Min length: ", min(lengths))
print("Median length: ", statistics.median(lengths))
print("Standard deviation: ", statistics.stdev(lengths))
