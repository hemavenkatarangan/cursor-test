public class Fibonacci {
    public static void main(String[] args) {
        int terms = 10; // default number of terms
        if (args.length > 0) {
            try {
                terms = Integer.parseInt(args[0]);
            } catch (NumberFormatException ex) {
                System.err.println("Invalid number provided. Falling back to 10 terms.");
            }
        }

        if (terms < 0) {
            System.err.println("Number of terms must be non-negative.");
            return;
        }

        printFibonacciSeries(terms);
    }

    public static void printFibonacciSeries(int terms) {
        if (terms == 0) {
            return;
        }

        long previous = 0L;
        long current = 1L;

        System.out.print(previous);
        for (int i = 1; i < terms; i++) {
            System.out.print(" " + current);
            long next = previous + current;
            previous = current;
            current = next;
        }
        System.out.println();
    }

    public static long fibonacciRecursive(int n) {
        if (n < 0) {
            throw new IllegalArgumentException("n must be >= 0");
        }
        if (n <= 1) {
            return n;
        }
        return fibonacciRecursive(n - 1) + fibonacciRecursive(n - 2);
    }

    public static long fibonacciIterativeNth(int n) {
        if (n < 0) {
            throw new IllegalArgumentException("n must be >= 0");
        }
        long previous = 0L;
        long current = 1L;
        for (int i = 0; i < n; i++) {
            long next = previous + current;
            previous = current;
            current = next;
        }
        return previous;
    }
}

